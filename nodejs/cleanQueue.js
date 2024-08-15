const { Queue } = require('bullmq');
require('dotenv').config();

async function cleanQueue() {
    const queueName = 'name-queue';
    const queue = new Queue(queueName, {
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            // password: process.env.REDIS_PASSWORD,
        },
    });

    try {
        console.log('Iniciando limpieza de la cola...');

        // Contar trabajos antes de la limpieza
        const jobCountBefore = await queue.getJobCounts('completed', 'failed', 'delayed', 'wait', 'active');
        console.log('Trabajos antes de la limpieza:', jobCountBefore);

        // Limpiar todos los tipos de trabajos
        // const jobTypes = ['completed', 'failed', 'delayed', 'wait', 'active'];
        const jobTypes = ['completed'];
        for (const type of jobTypes) {
            const cleaned = await queue.clean(1000, 10000, type);
            console.log(`Se limpiaron ${cleaned.length} trabajos ${type}`);
        }

        // Contar trabajos después de la limpieza
        const jobCountAfter = await queue.getJobCounts('completed', 'failed', 'delayed', 'wait', 'active');
        console.log('Trabajos después de la limpieza:', jobCountAfter);

        if (JSON.stringify(jobCountBefore) === JSON.stringify(jobCountAfter)) {
            console.log('No se eliminaron trabajos. Posibles razones:');
            console.log('1. No hay trabajos para limpiar.');
            console.log('2. Los trabajos son más recientes que el tiempo de gracia.');
            console.log('3. Problema de conexión con Redis.');
        } else {
            console.log('Cola limpiada exitosamente');
        }

    } catch (error) {
        console.error('Error al limpiar la cola:', error);
    } finally {
        await queue.close();
    }
}

cleanQueue().then(() => process.exit());