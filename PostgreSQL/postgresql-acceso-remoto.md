# postgresql-acceso-remoto

--Activar Escritorio remoto
Step 1. Configuring postgresql.conf
â€“ Edit this line in your postgresql.conf file as shown below.

# sudo vi /etc/postgresql/9.6/main/postgresql.conf #### Postgresql 9.6
# sudo vi /var/lib/pgsql/10/data/postgresql.conf ##### Postgresql 10
# sudo vi /var/lib/pgsql/11/data/postgresql.conf ##### Postgresql 11
#
# - Connection Settings -

listen_addresses = '*'                  # what IP address(es) to listen on;
                                        # comma-separated list of addresses;
                                        # defaults to 'localhost'; use '*' for all


Step 2. Configuring pg_hba.conf
â€“ Add the following line in the pg_hba.conf file to allow access to all databases for all users with an encrypted password:

# sudo vi /etc/postgresql/9.6/main/pg_hba.conf
# sudo vi /var/lib/pgsql/10/data/pg_hba.conf ##### FOR Postgresql 10
# sudo vi /var/lib/pgsql/11/data/pg_hba.conf ##### FOR Postgresql 11
#
# TYPE   DATABASE   USER   CIDR-ADDRESS   METHOD
  Host   all        all    0.0.0.0/0      md5
Step 3. Restart PostgreSQL Server
â€“ After making changes, we have to restart the PostgreSQL server

# sudo systemctl restart postgresql
# sudo systemctl restart postgresql-10  ### FOR Postgresql 10
# sudo systemctl restart postgresql-11 ### FOR Postgresql 11

 By default, PostgreSQL server listens at the port 5432, to allow the remote access we have to open the 5432 port

# CentOS 7 / RHEL 7
# sudo firewall-cmd --permanent --add-port=5432/tcp
# sudo firewall-cmd --reload
# Ubuntu 16.04
# sudo ufw allow 5432/tcp

