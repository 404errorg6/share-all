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

	svr := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	//	go testLogs()
	log.Fatal(svr.ListenAndServe())
}

func testLogs() {
	i := 0
	for i <= 1 {
		i++
		m := fmt.Sprintf("Logs testing %v...", i)
		logsCh <- m
		fmt.Println(m)
	}
}
