# multi-request

  cargarData() {

    const chofer = this.choferService.getChoferByIdPersona();
    const areas = this.areaService.traerAreas();
    const vehiculos = this.vehiculoService.traerVehiculos();

    forkJoin([chofer,areas, vehiculos])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(resp => {
        this.objChofer = resp[0];
        this.arrayAreas = resp[1];
        this.arrayVehiculos = resp[2];
        this.containerService.ok();
      }, error => {
        console.log(error);
        // this.containerService.error();
      })
  }


