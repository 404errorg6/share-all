package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/404errorg6/FTP-server/config"
)

var (
	httpHost = "localhost"
	httpPort = "8085"
)

func main() {
	fmt.Printf("Starting http server on %v:%v...\n", httpHost, httpPort)

	svr := &http.Server{
		Addr:    httpHost + ":" + httpPort,
		Handler: Mux(),
	}

	config.LogsCh <- "server ready to start"
	log.Fatal(svr.ListenAndServe())
}
