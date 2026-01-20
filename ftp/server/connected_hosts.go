package server

import "fmt"

func GetConnectedHosts() []string {
	hostsAddr := []string{}
	fmt.Printf("Connected Clients:\n")
	connectedClients.Range(func(key, value any) bool {
		valS, ok := value.(string)
		if !ok {
			sendToLogsChPtr(fmt.Sprintf("Unable to convert to string: %v", value))
			return false
		}

		fmt.Printf("	%v is connected\n", valS)
		hostsAddr = append(hostsAddr, valS)
		return true
	})
	return hostsAddr
}
