package server

import (
	"fmt"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func StopFTP() error {
	if !config.FTPServer.IsRunning {
		return nil
	}

	config.FTPServer.ConnectedClients.Range(disconnectClients)
	if err := config.FTPServer.Conn.Stop(); err != nil {
		config.LogsCh <- err.Error()
		return err
	}
	config.FTPServer.Conn = nil
	config.FTPServer.IsRunning = false
	config.DiscoveryClient.Close()

	config.LogsCh <- "server stopped"
	return nil
}

func disconnectClients(key any, val any) bool {
	client, ok := val.(config.Client)
	if !ok {
		config.LogsCh <- fmt.Sprintf("Unable to type-cast(Client): %v", val)
		return false
	}

	err := client.Context.Close()
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error while closing %v: %v", client.Msg, err)
		return true
	}

	config.LogsCh <- fmt.Sprintf("%v forcibly disconnected.", client.Msg)
	return true
}
