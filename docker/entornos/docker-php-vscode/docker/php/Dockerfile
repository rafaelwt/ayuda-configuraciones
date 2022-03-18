# docker/php/Dockerfile
FROM php:8.1-fpm

RUN apt-get update
RUN apt-get install -y autoconf pkg-config libssl-dev

RUN docker-php-ext-install pdo pdo_mysql mysqli

# Install git
RUN apt-get install -y git 

# Xdebug
RUN pecl install xdebug-3.1.2
ADD xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini

# Composer 
RUN curl -OL https://getcomposer.org/download/2.2.9/composer.phar \
    && mv composer.phar /usr/local/bin/composer \
    && chmod +x /usr/local/bin/composer