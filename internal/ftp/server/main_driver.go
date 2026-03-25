package server

import (
	"crypto/tls"
	"fmt"
	"slices"

	"changeme/internal/config"
	"github.com/fclairamb/ftpserverlib"
	"github.com/spf13/afero"
)

// TODO: Clean up this mess
// TODO: Disconnect even the ongoing transgfers?

type AndroidMainDriver struct {
}

func (d *AndroidMainDriver) GetSettings() (*ftpserver.Settings, error) {
	host, err := config.GetHost()
	if err != nil {
		return &ftpserver.Settings{}, err
	}

	settings := ftpserver.Settings{
		ListenAddr:              host + ":" + config.FTPServer.Port,
		PublicHost:              host,
		ActiveConnectionsCheck:  ftpserver.IPMatchRequired,
		PasvConnectionsCheck:    ftpserver.IPMatchRequired,
		IdleTimeout:             500,
		DeflateCompressionLevel: 6,
	}
	return &settings, nil
}

func (d *AndroidMainDriver) AuthUser(cc ftpserver.ClientContext, user, pass string) (ftpserver.ClientDriver, error) {
	var isAuthorized bool
	clientDriver := &AndroidClientDriver{}

	host, _, _ := config.GetHostPort(cc.RemoteAddr().String())

	if slices.Contains(config.FTPServer.BlackList, host) { //Unauthorize if blacklisted
		return nil, fmt.Errorf("%v is blocked", host)
	}

	if config.FTPServer.AnonymousAccessAllowed { //Authorize if anonymous is allowed by server and user is anonymous
		if user == "anonymous" && pass == "anonymous" {
			isAuthorized = true
		}
	}

	if !config.FTPServer.AnonymousAccessAllowed { //Authorize based on user/pass otherwise
		if user == config.FTPServer.User && pass == config.FTPServer.Password {
			isAuthorized = true
		}
	}

	if isAuthorized {
		fileSystem := afero.NewBasePathFs(afero.NewOsFs(), config.FTPServer.RootDir)

		if !config.FTPServer.WriteAllowed {
			fileSystem = afero.NewReadOnlyFs(fileSystem)
		}

		clientDriver.Fs = fileSystem
		if !alreadyConnected(cc.RemoteAddr().String()) { //Add new client only if not already connected
			addToConnectedClient(user, cc)
		}

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
