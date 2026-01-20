package main

import "os"

type Dir struct {
	Entries []FSObject
}

type FSObject struct {
	Name     string
	IsFolder bool
}

var (
	ftpPort          = "2121"
	ftpHost          = "0.0.0.0"
	httpPort         = "8085"
	httpHost         = "127.0.0.1"
	logsTestingCount = 0
	logsCh           = make(chan string, 100)
	homeDir, _       = os.UserHomeDir()
	svrRootDir       string
)
