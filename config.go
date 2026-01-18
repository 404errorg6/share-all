package main

import "os"

var (
	port             = "8085"
	logsTestingCount = 0
	logsCh           = make(chan string, 1)
	root, _          = os.UserHomeDir()
)
