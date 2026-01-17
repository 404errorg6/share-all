package server

import (
	"crypto/tls"
	"fmt"
	"sync"

	"github.com/fclairamb/ftpserverlib"
	"github.com/spf13/afero"
)

var (
	host            = "127.0.0.1"
	port            = "2121"
	addr            = host + ":" + port
	connectedClient sync.Map
)

type AndroidMainDriver struct {
}

func (d *AndroidMainDriver) GetSettings() (*ftpserver.Settings, error) {
	settings := ftpserver.Settings{
		ListenAddr: addr,
		PublicHost: host,
		PassiveTransferPortRange: ftpserver.PortRange{
			Start: 2122,
			End:   2130,
		},
	}
	return &settings, nil
}

func (d *AndroidMainDriver) ClientConnected(cc ftpserver.ClientContext) (string, error) {
	remote := cc.RemoteAddr().String()
	fmt.Printf("Client connected from: %v\n", remote)
	connectedClient.Store(cc.ID(), cc)
	msg := fmt.Sprintf("%v successfully connected to FTP.", remote)
	return msg, nil
}

func (d *AndroidMainDriver) ClientDisconnected(cc ftpserver.ClientContext) {
	remoteAddr := cc.RemoteAddr()
	connectedClient.Delete(cc.ID())
	fmt.Printf("%v diconnected.\n", remoteAddr.String())
}

func (d *AndroidMainDriver) AuthUser(cc ftpserver.ClientContext, user, pass string) (ftpserver.ClientDriver, error) {
	remote := "unknown"
	if cc != nil {
		remote = cc.RemoteAddr().String()
	}
	fmt.Printf("Auth attempt from %v with user=%q\n", remote, user)
	cDriver := &AndroidClientDriver{}
	cDriver.Fs = afero.NewOsFs()
	afero.WriteFile(cDriver.Fs, "test.txt", []byte("Hello FTP"), 0644)
	return cDriver, nil
}

func (d *AndroidMainDriver) GetTLSConfig() (*tls.Config, error) {
	return nil, nil
}
