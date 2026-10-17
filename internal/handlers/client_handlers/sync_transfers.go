package clienthandlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/gorilla/websocket"
)

var isSynced bool

func HandleSyncTransfer(w http.ResponseWriter, req *http.Request) {
	host := strings.Split(verifiedAddr, ":")[0]
	url := fmt.Sprintf("ws://%v:%v/api/ftp/server/sync-transfers", host, config.BridgePort)

	config.LogsCh <- fmt.Sprintf("Attempting to sync transfers to: %v", url)

	conn, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Could not connect to server: %v", err)
		return
	}
	defer conn.Close()

	for {
		isSynced = true
		var transfersArr []config.TransferInfo
		transferMap.Range(func(key, val any) bool {
			info, ok := val.(config.TransferInfo)
			if !ok {
				config.LogsCh <- fmt.Sprintf("Unable to typecast to TransferInfo the value: %v", val)
				return true
			}

			info.IsDownload = !info.IsDownload
			transfersArr = append(transfersArr, info)
			return true
		})

		err := conn.WriteJSON(transfersArr)
		if err != nil {
			config.LogsCh <- fmt.Sprintf("Error syncing transfer with server: %v", err)
			break
		}

		time.Sleep(time.Second)
	}

	isSynced = false
}
