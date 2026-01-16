package main

import (
	"fmt"
	"github.com/404errorg6/FTP-server/ftp/server"
	"log"
	"net/http"
)

var (
	port   = "8085"
	logsCh = make(chan string, 1)
)

func main() {
	fmt.Printf("Starting server on %v...\n", port)
	mux := Mux()

	svr := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	server.StartFTP(logsCh)
	log.Fatal(svr.ListenAndServe())
}
