package server

import (
	"fmt"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func StopFTP() error {
	if config.Server.Conn == nil {
		return fmt.Errorf("server is already dead")
	}

	config.Server.ConnectedClients.Range(rmClients)
	if err := config.Server.Conn.Stop(); err != nil {
		config.LogsCh <- fmt.Sprintf("Error occured while stopping server: %v", err.Error())
		return err
	}
	config.Server.Conn = nil

	config.LogsCh <- "server stopped"
	return nil
}

func rmClients(key any, val any) bool {
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
