package services

import (
	"changeme/internal/config"
	"changeme/internal/ftp/client"
	"fmt"

	"github.com/betamos/zeroconf"
)

type Discovery struct{}

var (
	stopDiscover = make(chan bool, 1)
)

func (ftp *Discovery) StartDiscovering() error {
	msg := "[DISCOVERY] Starting server discovery..."
	fmt.Println(msg)
	config.LogsCh <- msg
	
	discovery, err := zeroconf.New().Browse(
		func(entry zeroconf.Event) {
			logMsg := fmt.Sprintf("[DISCOVERY] Browser event: %s - %s", entry.Op, entry.Name)
			fmt.Println(logMsg)
			config.LogsCh <- logMsg

			svrInfo, err := client.ConvertEntryToServerInfo(entry)
			if err != nil {
				errMsg := fmt.Sprintf("[DISCOVERY] Error converting entry: %v", err)
				config.LogsCh <- errMsg
				return
			}

			discMsg := fmt.Sprintf("[DISCOVERY] Found server: %s (%s:%d)", svrInfo.Name, svrInfo.IP, svrInfo.Port)
			config.LogsCh <- discMsg
			config.App.Event.Emit("discovered-servers", svrInfo)
		},
		zeroconf.NewType(config.SERVICE),
	).Open()

	if err != nil {
		errMsg := fmt.Sprintf("[DISCOVERY] Failed to open browse: %v", err)
		config.LogsCh <- errMsg
		return err
	}
	defer discovery.Close()
	<-stopDiscover
	config.LogsCh <- "[DISCOVERY] Discovery stopped"
	fmt.Println("Discovery stopped")
	return nil
}

func (ftp Discovery) StopDiscovering() {
	stopDiscover <- true
}
