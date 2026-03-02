package client

import (
	"fmt"
	"net/netip"
	"strconv"
	"strings"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/betamos/zeroconf"
)

// TODO: Refactor this shit after kotlin integration
func ConvertEntryToServerInfo(entry zeroconf.Event) (config.ServerInfo, error) {
	svrInfo := config.ServerInfo{}

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
	localAddr, found := config.ConvertIfaceToAddr(config.WifiOrDataInterface)
	if !found {
		config.LogsCh <- fmt.Sprintf("[FATAL]: Invalid WifiOrDataInterface: %v", config.WifiOrDataInterface)
		return false
	}

	if addr.Compare(localAddr) == 0 {
		return true
	}

	return false
}
