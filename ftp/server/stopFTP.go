package server

import (
	"fmt"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func StopFTP() error {
	if !config.Server.IsRunning {
		return nil
	}

	config.Server.ConnectedClients.Range(disconnectClients)
	if err := config.Server.Conn.Stop(); err != nil {
		config.LogsCh <- err.Error()
		return err
	}
	config.Server.Conn = nil
	config.Server.IsRunning = false

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
