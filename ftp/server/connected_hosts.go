package server

import "fmt"

func GetConnectedHosts() []string {
	hostsAddr := []string{}
	fmt.Printf("Connected Clients:\n")
	connectedClients.Range(func(key, value any) bool {
		keyS, ok := key.(string)
		if !ok {
			sendToLogsChPtr(fmt.Sprintf("Unable to convert to string: %v", key))
			return false
		}

		fmt.Printf("%v is connected\n", key)
		hostsAddr = append(hostsAddr, keyS)
		return true
	})
	return hostsAddr
}
