package server

import (
	"crypto/tls"
	"fmt"
	"slices"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/fclairamb/ftpserverlib"
	"github.com/spf13/afero"
)

// TODO: Clean up this mess

type AndroidMainDriver struct {
}

func (d *AndroidMainDriver) GetSettings() (*ftpserver.Settings, error) {
	settings := ftpserver.Settings{
		ListenAddr:             config.FTPServer.Host + ":" + config.FTPServer.Port,
		PublicHost:             config.FTPServer.Host,
		ActiveConnectionsCheck: ftpserver.IPMatchRequired,
		PasvConnectionsCheck:   ftpserver.IPMatchRequired,
		IdleTimeout:            500,
	}
	return &settings, nil
}

func (d *AndroidMainDriver) AuthUser(cc ftpserver.ClientContext, user, pass string) (ftpserver.ClientDriver, error) {
	var isAuthorized bool
	clientDriver := &AndroidClientDriver{}

	host, _, _ := config.GetHostPort(cc.RemoteAddr().String())

	if alreadyConnected(host) {
		return nil, fmt.Errorf("%v is already connected", host)
	}

	if slices.Contains(config.FTPServer.BlackList, host) {
		return nil, fmt.Errorf("%v is blocked", host)
	}

	if config.FTPServer.AnonymousAccessAllowed {
		if user == "anonymous" && pass == "anonymous" {
			fileSystem := afero.NewBasePathFs(afero.NewOsFs(), config.FTPServer.RootDir)
			isAuthorized = true

			if !config.FTPServer.WriteAllowed {
				fileSystem = afero.NewReadOnlyFs(fileSystem)
			}

			clientDriver.Fs = fileSystem
		}
	}

	if isAuthorized {
		addToConnectedClient(user, cc)
		config.LogsCh <- fmt.Sprintf("%v authorization successful", cc.RemoteAddr().String())
		return clientDriver, nil
	}

	return nil, fmt.Errorf("Invalid credentials")
}

func (d *AndroidMainDriver) ClientConnected(cc ftpserver.ClientContext) (string, error) {
	remote := cc.RemoteAddr().String()

	msg := fmt.Sprintf("%v connected", remote)
	config.LogsCh <- msg
	return msg, nil
}

func (d *AndroidMainDriver) ClientDisconnected(cc ftpserver.ClientContext) {
	rmFromConnectedClients(cc)
	config.LogsCh <- fmt.Sprintf("%v diconnected.", cc.RemoteAddr().String())
}

func (d *AndroidMainDriver) GetTLSConfig() (*tls.Config, error) {
	return nil, nil
}
