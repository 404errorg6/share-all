package oti

const (
	APP_FILE_TRANSFER_PROTOCOL = "/share-all/ftp"
	APP_LS_PROTOCOL            = "/share-all/ls"
)

type TransferType int

const (
	FromServerToClient = iota
	FromClientToServer
)

type Header struct { //Sent as a request from client to server
	ClientFileName string
	TransferType   TransferType
	Path           string
	IsDir          bool
}
