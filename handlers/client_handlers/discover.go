package clienthandlers

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/betamos/zeroconf"
)

func HandlerDiscoverServers(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no")

	discover(w, req)
}

func discover(w http.ResponseWriter, req *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Unable to typecast to flusher", http.StatusInternalServerError)
		return
	}

	discovery, err := zeroconf.New().Browse(
		func(entry zeroconf.Event) {
			config.LogsCh <- fmt.Sprintln(entry.Op, entry.Name)

			svrInfo, err := client.ConvertEntryToServerInfo(entry)
			if err != nil {
				config.LogsCh <- err.Error()
				return
			}

			config.SendJSON(w, svrInfo)
			flusher.Flush()
		},
		zeroconf.NewType(config.SERVICE),
	).Open()

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer discovery.Close()

	<-req.Context().Done()
	fmt.Println("Exited discover")
}
