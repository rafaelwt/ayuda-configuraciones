<?php
class Persona {
    public $nombre;

    public function __construct($nombre) {
        $this->nombre = $nombre;
    }

    public function saludar() {
        echo "Hola, soy " . $this->nombre;
    }
}