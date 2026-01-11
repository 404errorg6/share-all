package main

import (
	"fmt"
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

	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Fatal(server.ListenAndServe())
}
