# FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
# WORKDIR /app
# RUN sed -i 's/TLSv1.2/TLSv1/g' /etc/ssl/openssl.cnf
# EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /app


COPY . .
RUN dotnet restore
RUN dotnet publish -o /app/published-app

FROM mcr.microsoft.com/dotnet/aspnet:6.0 as runtime
# FROM mcr.microsoft.com/dotnet/runtime:6.0 AS final

RUN sed 's/TLSv1.2/TLSv1/' /etc/ssl/openssl.cnf > /etc/ssl/openssl.cnf.changed \
	&& mv /etc/ssl/openssl.cnf.changed /etc/ssl/openssl.cnf
RUN sed 's/DEFAULT@SECLEVEL=2/DEFAULT@SECLEVEL=1/' /etc/ssl/openssl.cnf > /etc/ssl/openssl.cnf.changed \
	&& mv /etc/ssl/openssl.cnf.changed /etc/ssl/openssl.cnf


# RUN sed -i '1i openssl_conf = default_conf' /etc/ssl/openssl.cnf && echo -e "\n[ default_conf ]\nssl_conf = ssl_sect\n[ssl_sect]\nsystem_default = system_default_sect\n[system_default_sect]\nMinProtocol = TLSv1\nCipherString = DEFAULT@SECLEVEL=1" >> /etc/ssl/openssl.cnf

WORKDIR /app

# RUN apt-get update
RUN apt-get update
RUN apt-get install -y vim 

COPY --from=build /app/published-app /app
RUN mkdir -p /app/Resources/Planta
RUN mkdir -p /app/Resources/Contrato

ENTRYPOINT [ "dotnet", "/app/WebApiBoletas.dll" ]