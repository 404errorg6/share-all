package clienthandlers

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

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
	serversInfo, err := discover()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	config.SendJSON(w, serversInfo)
}

func discover() ([]ServerInfo, error) {
	var serversInfo []ServerInfo
	entries := make(chan *zeroconf.ServiceEntry, 100)

	resolver, err := zeroconf.NewResolver(zeroconf.SelectIfaces(config.WifiOrDataInterface))
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	err = resolver.Browse(ctx, config.SERVICE, config.DOMAIN, entries)
	if err != nil {
		return nil, err
	}

	for entry := range entries {
		svrInfo, err := convertEntryToServerInfo(entry)
		if err != nil {
			config.LogsCh <- err.Error()
			continue
		}

		serversInfo = append(serversInfo, svrInfo)
	}

	return serversInfo, nil
}

func convertEntryToServerInfo(entry *zeroconf.ServiceEntry) (ServerInfo, error) {
	fmt.Printf("Called with %v\n", *entry)
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
		if strings.HasPrefix(s, "AnonymousAllowed=") {
			parts := strings.Split(s, "=")
			if len(parts) == 2 {
				b, err := strconv.ParseBool(parts[1])
				if err == nil {
					anonAllowed = b
				}
			}
			break
		}

		serverInfo.AnonymousAllowed = anonAllowed
	}
	fmt.Printf("Returning %v", serverInfo)
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
