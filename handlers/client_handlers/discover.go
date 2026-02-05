package clienthandlers

import (
	"context"
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
	var nilEntries []ServerInfo
	entries := make(chan *zeroconf.ServiceEntry, 100)
	resolver, err := zeroconf.NewResolver()
	if err != nil {
		return nilEntries, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	err = resolver.Browse(ctx, config.SERVICE, config.DOMAIN, entries)
	if err != nil {
		return nilEntries, err
	}

	// Important: We need to consume the channel until it's closed by zeroconf (when context expires)
	slimmed, err := convertEntriesToServerInfo(entries)
	if err != nil {
		return nilEntries, err
	}

	return slimmed, nil
}

func convertEntriesToServerInfo(entries chan *zeroconf.ServiceEntry) ([]ServerInfo, error) {
	slimmedEntries := []ServerInfo{}

	for entry := range entries {
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

		// Safe check for AnonymousAllowed in Text records
		anonAllowed := false
		for _, s := range entry.Text {
			if strings.HasPrefix(s, "AnonymousAllowed=") {
				parts := strings.Split(s, "=")
				if len(parts) == 2 {
					b, _ := strconv.ParseBool(parts[1])
					anonAllowed = b
				}
				break
			}
		}

		serverInfo.AnonymousAllowed = anonAllowed
		slimmedEntries = append(slimmedEntries, serverInfo)
	}
	return slimmedEntries, nil
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
