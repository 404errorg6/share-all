package clienthandlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/netip"
	"strconv"
	"strings"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/betamos/zeroconf"
)

// TODO: Do not discover your own server
type ServerInfo struct {
	Name             string
	IP               string
	Port             string
	AnonymousAllowed bool
}

func HandlerDiscoverServers(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no")

	discover(w, req)
}

func discover(w http.ResponseWriter, req *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Unable to typecast to flusher", http.StatusInternalServerError)
		return
	}

	discovery, err := zeroconf.New().Browse(
		func(entry zeroconf.Event) {
			config.LogsCh <- fmt.Sprintln(entry.Op, entry.Name)

			err := sendEntries(entry, w, flusher)
			if err != nil {
				config.LogsCh <- err.Error()
			}
		},
		zeroconf.NewType(config.SERVICE),
	).Open()

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer discovery.Close()

	<-req.Context().Done()
	fmt.Println("Exited discover")
}

func sendEntries(entry zeroconf.Event, w http.ResponseWriter, flusher http.Flusher) error {
	svrInfo, err := convertEntryToServerInfo(entry)
	if err != nil {
		config.LogsCh <- err.Error()
		return err
	}

	config.LogsCh <- fmt.Sprintf("Sending %+v", svrInfo)

	data, err := json.Marshal(svrInfo)
	if err != nil {
		config.LogsCh <- err.Error()
		return err
	}

	w.Write(data)
	flusher.Flush()
	return nil
}

func convertEntryToServerInfo(entry zeroconf.Event) (ServerInfo, error) {
	serverInfo := ServerInfo{}

	// Check for AnonymousAllowed in Text records
	anonAllowed := false
	for _, s := range entry.Text {
		if strings.Contains(s, "=") {
			parts := strings.Split(s, "=")
			if len(parts) == 2 {
				b, err := strconv.ParseBool(parts[1])
				if err == nil {
					anonAllowed = b
				}
			}
			break
		}
	}

	serverInfo.Name = entry.Name
	serverInfo.IP = getUsableIP(entry.Addrs)
	serverInfo.Port = strconv.Itoa(int(entry.Port))
	serverInfo.AnonymousAllowed = anonAllowed
	return serverInfo, nil
}

func getUsableIP(addrs []netip.Addr) string {
	for _, addr := range addrs {
		if addr.Is4() && addr.IsPrivate() && !addr.IsLoopback() {
			return addr.String()
		}

	}

	return "Unknown"
}
