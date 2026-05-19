from pathlib import Path
import shutil


def main():
    # Carpeta donde se ejecuta el script
    parent_dir = Path.cwd()

    # Nombre de la carpeta destino: <nombre-folder-padre>-env
    output_dir = parent_dir.parent / f"{parent_dir.name}-env"
    output_dir.mkdir(exist_ok=True)

    print(f"Buscando archivos .env en: {parent_dir}")
    print(f"Copiando archivos a: {output_dir}")
    print("-" * 60)

    total_found = 0

    # Recorre solo las carpetas directas del folder padre
    for child_dir in parent_dir.iterdir():
        if not child_dir.is_dir():
            continue

        # Evita procesar la carpeta de salida si estuviera dentro
        if child_dir.name == output_dir.name:
            continue

        env_file = child_dir / ".env"

        if env_file.exists() and env_file.is_file():
            destination_file = output_dir / f"{child_dir.name}.env"

            shutil.copy2(env_file, destination_file)

            print(f"OK: {env_file} -> {destination_file}")
            total_found += 1

    print("-" * 60)

    if total_found == 0:
        print("No se encontraron archivos .env.")
    else:
        print(f"Proceso terminado. Archivos copiados: {total_found}")


if __name__ == "__main__":
    main()