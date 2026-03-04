package httphandlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/config"
)

var (
	addr = "0.0.0.0:8080"
)

func HandleStartWebUI(w http.ResponseWriter, req *http.Request) {
	/*	server := &http.Server{
			Addr: addr,
		}

		err := server.ListenAndServe()
		if err != nil {
			config.LogsCh <- err.Error()
		}
	*/
	fmt.Printf("Starting unsecure sharing...\n")

	go func() { log.Fatal(http.ListenAndServe(addr, http.FileServer(http.Dir(config.DefLocalDir)))) }()
}
