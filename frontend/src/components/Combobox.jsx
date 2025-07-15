export default function Combobox() {
    return(
        <div class="flex w-screen h-screen dark:bg-gray-900 justify-center items-center">
            <div class="w-[150px] text-gray-900 dark:text-gray-100">
            <div class="relative w-full group">
                <label class="text-xs text-gray-400">Select Category</label><button class="py-2.5 px-3 w-full md:text-sm text-site bg-transparent border border-dimmed  focus:border-brand focus:outline-none focus:ring-0 peer flex items-center justify-between rounded font-semibold">All</button>
                    <div
                        class="absolute z-[99] top-[100%] left-[50%] translate-x-[-50%] rounded-md overflow-hidden shadow-lg min-w-[200px] w-max peer-focus:visible peer-focus:opacity-100 opacity-0 invisible duration-200 p-1 bg-gray-100 dark:bg-gray-800  border border-dimmed text-xs md:text-sm">
                        <div
                            class=" w-full block cursor-pointer hover:bg-white dark:hover:bg-gray-900 dark:bg-gray-800 hover:text-link px-3 py-2 rounded-md">
                            All (9)</div>
                        <div
                            class=" w-full block cursor-pointer hover:bg-white dark:hover:bg-gray-900 dark:bg-gray-800 hover:text-link px-3 py-2 rounded-md">
                            Full Stack (6)</div>
                    </div>
                </div>
            </div>
        </div>
    )
};