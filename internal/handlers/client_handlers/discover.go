package clienthandlers

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/404errorg6/share-all/internal/ftp/client"

	"github.com/betamos/zeroconf"
)

func HandlerDiscoverServers(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no")

	client.DeAuthClient()

	discover(w, req)
}

func discover(w http.ResponseWriter, req *http.Request) {
	discovery, err := zeroconf.New().Browse(
		disocveryCallback(w),
		zeroconf.NewType(config.SERVICE),
	).Open()

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer discovery.Close()

	<-req.Context().Done()
}

func disocveryCallback(w http.ResponseWriter) func(zeroconf.Event) {
	return func(entry zeroconf.Event) {
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Unable to typecast to flusher", http.StatusInternalServerError)
			return
		}

		config.LogsCh <- fmt.Sprintln(entry.Op, entry.Name)

		svrInfo, err := client.ConvertEntryToServerInfo(entry)
		if err != nil {
			config.LogsCh <- err.Error()
			return
		}

		config.SendJSON(w, svrInfo)
		flusher.Flush()
	}
}
