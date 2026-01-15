package server

import (
	"fmt"
	"net"
	"os"
	"sync"

	filedriver "github.com/404errorg6/FTP-server/ftp/file_driver"
	"github.com/goftp/server"
)

var (
	svr      *server.Server
	listener *trackedListener
	mu       sync.Mutex
)

func StartFTP(logsCh chan string) error {
	port := 2121
	msg := fmt.Sprintf("server start successfully on port: %d", port)
	path, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	l, err := net.Listen("tcp", fmt.Sprintf(":%v", port))
	if err != nil {
		return err
	}
	listener = newTrackedListener(l)

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

	go func() {
		err := svr.Serve(listener)
		if err != nil {
			logsCh <- err.Error()
		}
	}()
	return nil
}

func StopFTP() {
	mu.Lock()
	defer mu.Unlock()

	if listener != nil {
		listener.closeAll()
	}

	if svr != nil {
		err := svr.Shutdown()
		if err != nil {
			fmt.Printf("Error occured while closing server: %v\n", err)
		}
	}
}
