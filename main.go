package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	fmt.Printf("Starting server on %v...\n", port)
	mux := Mux()

	svr := &http.Server{
		Addr:    ":" + port,
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
