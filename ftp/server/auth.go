package server

type PermissiveAuth struct{}

func (a *PermissiveAuth) CheckPasswd(user, pass string) (bool, error) {
	return true, nil // Always allow login
}
