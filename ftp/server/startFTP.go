package server

import (
	"log"
	"os"
	"strconv"

	filedriver "github.com/404errorg6/FTP-server/ftp/file_driver"
	"github.com/goftp/server"
)

var (
	svr *server.Server
)

func StartFTP() error {
	port := 2121
	msg := "server start successfully on port " + strconv.Itoa(port)
	path, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	driverFactory := filedriver.FileDriverFactory{
		RootPath: path,
	}

	svr = server.NewServer(
		&server.ServerOpts{
			Factory:        &driverFactory,
			WelcomeMessage: msg,
			Port:           port,
			Auth:           &PermissiveAuth{},
		},
	)

	go startLog()
	return nil
}

func startLog() {
	log.Fatal(svr.ListenAndServe())
}

func StopFTP() {
	if svr != nil {
		svr.Shutdown()
	}
}
