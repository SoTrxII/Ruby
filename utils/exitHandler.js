//Subscope to emulate a static variable
{
    let isExiting = false;
    /**
     * @summary Handler to clean up remaining processes before exiting
     * @param  {Object[]} options variables to handle special case while switching off
     * @param  {Exception[]} err Exception that caused Rin's death
     */
    exports.exitHandler = (options, err) => {
        if (isExiting) {
            return;
        }
        isExiting = true;
        if (options.panic) {
            console.error("\nUn uncaught Exception occured. Stopping Ruby", err.stack);
            console.trace();
        } else if (options.cleanup) {
            console.debug("\nLogging out Ruby ...");
        }
        global.Rin.destroy().then(console.debug("Logged out ! Now Halting"));
        process.exit(0);
    }
}