package clienthandlers

var (
	uploadLimit = 3
	uploadPass  = make(chan bool, uploadLimit)
)

func init() {
	for range uploadLimit {
		uploadPass <- true
	}
}

func uploadWithProgress(remoteFilePath, localFilePath string, wait chan bool) {
	<-uploadPass
	defer func() { uploadPass <- true }()
}
