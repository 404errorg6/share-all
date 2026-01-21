package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func main() {
	fmt.Printf("Starting http server on %v:%v...\n", config.HTTPHost, config.HTTPPort)
	mux := Mux()

	svr := &http.Server{
		Addr:    config.HTTPHost + ":" + config.HTTPPort,
		Handler: mux,
	}

	go testLogs()
	config.LogsCh <- "server ready to start"
	log.Fatal(svr.ListenAndServe())
}

func testLogs() {
	i := 1
	for i <= config.LogsTestingCount {
		m := fmt.Sprintf("Logs testing %v...", i)
		config.LogsCh <- m
		i++
	}
}
