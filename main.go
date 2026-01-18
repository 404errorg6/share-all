package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/server"
)

func main() {
	fmt.Printf("Starting http server on %v:%v...\n", httpHost, httpPort)
	server.Init(ftpHost, ftpPort, logsCh, root)
	mux := Mux()

	svr := &http.Server{
		Addr:    httpHost + ":" + httpPort,
		Handler: mux,
	}

	go testLogs()
	logsCh <- "server ready to start"
	log.Fatal(svr.ListenAndServe())
}

func testLogs() {
	i := 1
	for i <= logsTestingCount {
		m := fmt.Sprintf("Logs testing %v...", i)
		logsCh <- m
		i++
	}
}
