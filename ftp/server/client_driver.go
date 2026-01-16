package server

import (
	ftpserver "github.com/fclairamb/ftpserverlib"
	"github.com/spf13/afero"
)

type AndroidClientDriver struct {
	afero.Fs
}

func (d *AndroidClientDriver) AuthUser(cc ftpserver.ClientContext, user, pass string) (ftpserver.ClientDriver, error) {
	d.Fs = afero.NewOsFs()
	return d, nil
}

func (d *AndroidClientDriver) GetFs() afero.Fs {
	return d.Fs
}
