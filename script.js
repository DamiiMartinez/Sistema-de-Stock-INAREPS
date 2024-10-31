class Dispositivo {
    static async ConectarDispositivo() {
      navigator.hid.requestDevice({ filters: [ { usagePage: 0x01, usage: 0x06 } ] })
      .then(devices => {
        if (devices.length > 0) {
          const device = devices[0];
          this.dispositivoActual = device;
          device.open();

          this.iniciarEscaneo(); // Escanea inmediatamente después de la conexión
        } else {
          alert('No se seleccionó ningún dispositivo.');
        }
      })
      .then(() => {
        console.log('Conexión establecida con el dispositivo.');
      })
    }

    static iniciarEscaneo() {
        // Inicia el escaneo periódico de dispositivos cada 2 segundos
        intervalo = setInterval(() => this.escanearHID(), 500);
    }

    static async escanearHID() {
      try {
        const dispositivos = await navigator.hid.getDevices();
        if (dispositivos.length > 0) {
            // Ocultar botón de conectar y mostrar el de escaneo
            document.getElementById('Inicio').style.display = "none";
            document.getElementById('Escaner').style.display = "block";
            document.getElementById('main').style.display = "block";
        } else {
          if (this.dispositivoActual !== null) {
            // Si el dispositivo previamente conectado ya no está
            document.getElementById('Escaner').style.display = "none";
            document.getElementById('main').style.display = "none";

            alert('Dispositivo Desconectado: Reconectelo');
            this.dispositivoActual = null;

            this.iniciarEscaneo();
          }
        }
      } catch (error) {
        document.getElementById('Inicio').style.display = "block";
        document.getElementById('Escaner').style.display = "none";

        alert('Error al escanear dispositivos HID:', error);
      }
    }
};

class Lectora {
    constructor(Entrada) {
        this.Entrada = Entrada;
    }

    ProcesarDatos() {
        if (this.Entrada) {
            const Lineas = this.Entrada.split('\n');

            let ProductosAceptados = [];
            let ProductoTemporal = null;
            let CantidadTemporal = '';

            const fechaCompleta = new Date();
            // Cambiar el formato de la fecha a 'DD/MM/YYYY'
            const dia = String(fechaCompleta.getDate()).padStart(2, '0'); // Obtener el día y añadir un cero si es necesario
            const mes = String(fechaCompleta.getMonth() + 1).padStart(2, '0'); // Obtener el mes y añadir un cero si es necesario
            const anio = fechaCompleta.getFullYear(); // Obtener el año

            const fechaCadena = `${dia}/${mes}/${anio}`; // Formato 'DD/MM/YYYY'
            const tiempoCadena = fechaCompleta.toTimeString().split(' ')[0]; // 'hh:mm:ss'

            Lineas.forEach(line => {
                if (line === '#13' || (line.length === 3 && line.includes("13"))) {
                    if (ProductoTemporal && CantidadTemporal) {
                        ProductosAceptados.push({
                            CodigoProducto: ProductoTemporal,
                            Cantidad: CantidadTemporal,
                            Fecha: fechaCadena, // Usar el nuevo formato de fecha
                            Hora: tiempoCadena,
                        });
                    }
                    ProductoTemporal = null;
                    CantidadTemporal = '';
                } else if (line === '#08' || (line.length === 3 && line.includes("08"))) {
                    ProductoTemporal = null;
                    CantidadTemporal = '';
                } else if (/^\d+$/.test(line)) {
                    if (ProductoTemporal === null) {
                        ProductoTemporal = line;
                    } else {
                        CantidadTemporal += line;
                    }
                } else if (line === ',') {
                    CantidadTemporal += '.';
                }
            });
            return ProductosAceptados;
        } else {
            alert('No se ingresó ningún dato');
        }
    }
};

class Inventario {
        // En el método GuardarDatosEnServidor
    async GuardarDatosEnServidor(ProductosAceptadosA) {
        try {
            const response = await fetch('http://localhost:3000/guardar-datos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ProductosAceptadosA)
            });

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            const data = await response.json(); // Aquí se recibe el JSON

            console.log('Success:', data);
            this.mostrarInventario(); // Mostrar el inventario después de guardar
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async mostrarInventario() {
        document.getElementById('tabla_contenedor').style.display = "block";

        try {
            const response = await fetch('http://localhost:3000/mostrar-datos');

            // Verifica si la respuesta es correcta
            if (!response.ok) {
                throw new Error('Error al obtener datos del servidor');
            }

            const datos = await response.json();
            const tablaCuerpo = document.querySelector("#datos tbody");
            tablaCuerpo.innerHTML = ''; // Limpiar contenido previo

            datos.forEach(producto => {
                // Crea una nueva fila
                const fila = document.createElement("tr");

                // Recorre los datos y crea celdas para cada campo
                for (let key in producto) {
                    if (key !== 'id') { // Excluir 'id'
                        const celda = document.createElement("td");
                        celda.textContent = producto[key];
                        fila.appendChild(celda); // Agrega la celda a la fila
                    }
                }
                
                tablaCuerpo.appendChild(fila); // Agrega la fila al cuerpo de la tabla
            });

            console.log('Datos mostrados correctamente:', datos);
        } catch (error) {
            console.error('Error en la solicitud fetch:', error);
        }
    }
}

class Sistema {
    GenerarYDescargarArchivo(ProductosAceptadosB) {
        let contenido = '';
        
        const fechaCompleta = new Date();
        // Cambiar el formato de la fecha a 'DD/MM/YYYY'
        const dia = String(fechaCompleta.getDate()).padStart(2, '0'); // Obtener el día y añadir un cero si es necesario
        const mes = String(fechaCompleta.getMonth() + 1).padStart(2, '0'); // Obtener el mes y añadir un cero si es necesario
        const anio = fechaCompleta.getFullYear(); // Obtener el año

        const fechaCadena = `${dia}/${mes}/${anio}`; // Formato 'DD/MM/YYYY'
        const tiempoCadena = fechaCompleta.toTimeString().split(' ')[0]; // 'hh:mm:ss'

        // Añadir la fecha y hora al contenido
        contenido += `Fecha: ${fechaCadena}\n`;
        contenido += `Hora: ${tiempoCadena}\n`;
        contenido += `\n`; // Línea en blanco para separar

        ProductosAceptadosB.forEach(producto => {
            contenido += `Código: ${producto.CodigoProducto}, Cantidad: ${producto.Cantidad}\n`;
        });

        // Crear el archivo .txt
        const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = `productos_aceptados_${fechaCadena} - ${tiempoCadena}.txt`;
        enlace.click();

        this.mostrarTabla(ProductosAceptadosB);
    }

    mostrarTabla(ProductosAceptadosC){
        document.getElementById('tabla_contenedor').style.display="block";
        document.getElementById('tabla_ingreso').style.display="block";

        const tablaCuerpo = document.querySelector("#tabla tbody");

        // Recorre los arrays y crea filas para cada par de datos
        ProductosAceptadosC.forEach(producto => {
            // Crea una nueva fila
            const fila = document.createElement("tr");

            // Recorre los arrays y crea filas para cada par de datos
            for (let i in producto) {
                const celda = document.createElement("td");
                celda.textContent = producto[i];
                // Agrega las celdas a la fila
                fila.appendChild(celda);
            }
            // Agrega la fila al cuerpo de la tabla
            tablaCuerpo.appendChild(fila);
        });
    }
};

window.onload = function() {
    const Conexion = document.getElementById('Conectar');

    const Mostrar = document.getElementById('Mostrar');
    const Limpiar = document.getElementById('Limpiar');
    const Procesar = document.getElementById('Procesar');

    const Cerrar = document.getElementById('Cerrar');
    const Actualizar = document.getElementById('Actualizar');

    const textarea = document.getElementById('EntradaScanner');
    let counter = 0;

    Conexion.addEventListener('click', function(){
        Dispositivo.ConectarDispositivo();
    });

    textarea.addEventListener("input", function(){
        if(textarea.value){
            Limpiar.style.display='block';
            Procesar.style.display='block';
        }
        else{
            Limpiar.style.display='none';
            Procesar.style.display='none';
        }
    });

    Mostrar.addEventListener('click', function(){
        const Inventario1 = new Inventario();
        Inventario1.mostrarInventario();
    });

    Limpiar.addEventListener('click', function(){
        document.getElementById('EntradaScanner').value='';
    });

    Procesar.addEventListener('click', function() {
        const Entrada = document.getElementById('EntradaScanner').value;

        const Lectora1 = new Lectora(Entrada);
        const datos = Lectora1.ProcesarDatos();
        if( datos !== ''){
            const Inventario1 = new Inventario();
            const Sistema1 = new Sistema();

            Inventario1.GuardarDatosEnServidor( datos );
            Sistema1.GenerarYDescargarArchivo( datos );

            document.getElementById('EntradaScanner').value='';
        }
    });

    textarea.addEventListener("input", function(){
        let contenido = [];
        counter++;
        contenido.push(textarea.value);
        if(counter >= 4 && textarea.value.includes("%")){
            textarea.value='';

            contenido.join();
            alert('Bateria del Dispositivo: ' + `${contenido}`);
            contenido = [];
            counter = 0;
        }
    });

    Actualizar.addEventListener('click', function(){
        const Inventario1 = new Inventario();
        Inventario1.mostrarInventario();
    });

    Cerrar.addEventListener('click', function(){
        document.getElementById('tabla_contenedor').style.display="none";
        document.getElementById('Escaner').style.display="block";    
    });
};