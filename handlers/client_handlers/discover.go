package clienthandlers

import (
	"fmt"
	"log"
	"net/http"

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
	ctx := req.Context()

	go config.DiscoveryClient.Browse(
		func(e zeroconf.Event) {
			log.Println(e.Op, e.Name)
		},
		zeroconf.NewType(config.SERVICE),
	)

	<-ctx.Done()

	fmt.Println("Exited discover")
}

/*
func sendEntries(ctx context.Context, entries zeroconf.Event, w http.ResponseWriter) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Could not type-cast to flusher", http.StatusInternalServerError)
		return
	}

}

func convertEntryToServerInfo(entry *zeroconf.ServiceEntry) (ServerInfo, error) {
	serverInfo := ServerInfo{}
	// Use Instance name as it's more descriptive in Zeroconf
	instance := strings.ReplaceAll(entry.Instance, "\\", "") //Clean it
	serverInfo.Name = instance
	if serverInfo.Name == "" {
		serverInfo.Name = entry.HostName
	}

	// Try IPv4 first, fallback to IPv6 if needed
	serverInfo.IP = getUsableIP(entry.AddrIPv4)
	if serverInfo.IP == "Unknown" && len(entry.AddrIPv6) > 0 {
		serverInfo.IP = entry.AddrIPv6[0].String()
	}

	if serverInfo.IP == config.DefFTPHost {
		return serverInfo, fmt.Errorf("Skipping local server...")
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
*/
