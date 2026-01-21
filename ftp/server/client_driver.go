package server

import (
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/spf13/afero"
)

type AndroidClientDriver struct {
	Permisson config.Access
	afero.Fs
}

func (d *AndroidClientDriver) GetFs() afero.Fs {
	return d.Fs
}
