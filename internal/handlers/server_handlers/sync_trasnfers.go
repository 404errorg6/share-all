package serverhandlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/gorilla/websocket"
	"github.com/wailsapp/wails/v3/pkg/application"
)

var running bool
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleSyncTransfers(w http.ResponseWriter, r *http.Request) {
	app := application.Get()

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error while upgrading to websocket: %v", err)
		return
	}
	defer conn.Close()

	for {
		err := conn.SetReadDeadline(time.Now().Add(time.Minute))
		if err != nil {
			config.LogsCh <- fmt.Sprintf("Error setting deadline: %v", err)
			break
		}

		var transfersArr []config.TransferInfo
		err = conn.ReadJSON(&transfersArr)
		if err != nil {
			config.LogsCh <- fmt.Sprintf("Error decoding transfer data: %v", err)
			break
		}

		for _, transferInfo := range transfersArr {
			app.Event.Emit("transfers:ongoing", transferInfo)
		}
	}

	config.LogsCh <- "Exited transfer-sync due to error"
}

func StartBridgeServer() {
	if running {
		return
	}

	http.HandleFunc("POST /api/ftp/server/sync-transfers", HandleSyncTransfers)
	addr := fmt.Sprintf("%v:%v", config.GetLocalIP(), config.BridgePort)
	running = true

	err := http.ListenAndServe(addr, nil)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error running bridge server: %v", err)
		return
	}
}
