package clienthandlers

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/grandcat/zeroconf"
)

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

// TODO: Connect and go back to discovery, doesn't work
func discover(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	entries := make(chan *zeroconf.ServiceEntry, 100)

	flusher, ok := w.(http.Flusher)
	if !ok {
		config.LogsCh <- "Could not type-cast to flusher"
		return
	}

	resolver, err := zeroconf.NewResolver()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = resolver.Browse(ctx, config.SERVICE, config.DOMAIN, entries)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for {
		select {
		case entry := <-entries:
			svrInfo, err := convertEntryToServerInfo(entry)
			if err != nil {
				config.LogsCh <- err.Error()
				continue
			}

			body, err := json.Marshal(svrInfo)
			if err != nil {
				config.LogsCh <- err.Error()
				continue
			}

			_, err = fmt.Fprintf(w, "data: %s\n\n", body)
			if err != nil {
				config.LogsCh <- err.Error()
			}
			flusher.Flush()
			fmt.Printf("ServerInfo: %v\n", svrInfo)

		case <-ctx.Done(): //Exit function if user moves to another page
			return
		}
	}
}

func convertEntryToServerInfo(entry *zeroconf.ServiceEntry) (ServerInfo, error) {
	serverInfo := ServerInfo{}
	// Use Instance name as it's more descriptive in Zeroconf
	serverInfo.Name = entry.Instance
	if serverInfo.Name == "" {
		serverInfo.Name = entry.HostName
	}

	// Try IPv4 first, fallback to IPv6 if needed
	serverInfo.IP = getUsableIP(entry.AddrIPv4)
	if serverInfo.IP == "Unknown" && len(entry.AddrIPv6) > 0 {
		serverInfo.IP = entry.AddrIPv6[0].String()
	}

	serverInfo.Port = strconv.Itoa(entry.Port)

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
	serverInfo.AnonymousAllowed = anonAllowed
	return serverInfo, nil
}

func getUsableIP(ips []net.IP) string {
	for _, ip := range ips {
		// 1. Ensure it is an IPv4 address
		ipv4 := ip.To4()
		if ipv4 == nil {
			continue
		}

		// 2. Ignore Loopback (127.0.0.1) and Link-Local (169.254.x.x)
		if !ipv4.IsLoopback() && !ipv4.IsLinkLocalUnicast() {
			return ipv4.String()
		}
	}

	// Fallback: If no "good" IP is found, take the first one available
	if len(ips) > 0 {
		return ips[0].String()
	}

	return "Unknown"
}
