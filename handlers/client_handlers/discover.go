package clienthandlers

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/netip"
	"strconv"
	"strings"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/betamos/zeroconf"
)

// TODO: refactor this shit after kotlin integration
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
		return err
	}

	data, err := json.Marshal(svrInfo)
	if err != nil {
		return err
	}

	w.Write(data)
	flusher.Flush()
	return nil
}

func convertEntryToServerInfo(entry zeroconf.Event) (ServerInfo, error) {
	svrInfo := ServerInfo{}

	ip, err := getUsableIP(entry.Addrs)
	if err != nil {
		return svrInfo, err
	}

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

	svrInfo.Name = entry.Name
	svrInfo.IP = ip.String()
	svrInfo.Port = strconv.Itoa(int(entry.Port))
	svrInfo.AnonymousAllowed = anonAllowed
	return svrInfo, nil
}

func getUsableIP(addrs []netip.Addr) (netip.Addr, error) {
	for _, addr := range addrs {
		if addr.Is4() && addr.IsPrivate() && !addr.IsLoopback() {
			firstOctet := addr.As4()[0]

			if !(firstOctet >= 192 && firstOctet <= 223) { //Ensure we're checking class C addresses
				config.LogsCh <- fmt.Sprintf("Skipped not class C addr: %v", addr.String())
				continue
			}

			if isLocal(addr) {
				config.LogsCh <- fmt.Sprintf("Skipped local addr: %v", addr.String())
				continue
			}

			return addr, nil
		}

	}

	return netip.Addr{}, fmt.Errorf("No usable ip found")
}

func isLocal(addr netip.Addr) bool {
	localAddr, found := convertIfaceToAddr(config.WifiOrDataInterface)
	if !found {
		config.LogsCh <- fmt.Sprintf("[FATAL]: Invalid WifiOrDataInterface: %v", config.WifiOrDataInterface)
		return false
	}

	if addr.Compare(localAddr) == 0 {
		return true
	}

	return false
}

func convertIfaceToAddr(iface net.Interface) (netip.Addr, bool) {
	addrs, _ := iface.Addrs()
	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok && !ipNet.IP.IsLoopback() {
			// Ensure it's IPv4 for this example
			if ip4 := ipNet.IP.To4(); ip4 != nil {
				finalAddr, ok := netip.AddrFromSlice(ip4)
				if ok {
					return finalAddr, true
				}
			}
		}
	}

	return netip.Addr{}, false
}
