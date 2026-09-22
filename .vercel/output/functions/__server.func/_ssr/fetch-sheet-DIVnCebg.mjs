import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fetch-sheet-DIVnCebg.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var SheetRequest = object({
	id: string().regex(/^[a-zA-Z0-9-_]{16,}$/),
	gid: string().regex(/^[0-9]{1,12}$/)
});
var fetchGoogleSheetCsv = createServerFn({ method: "POST" }).validator(SheetRequest).handler(createSsrRpc("b34f55b773706e6f32c7933973a37c5e87dd3958403c9cb4fc9d423cd474c99b"));
//#endregion
export { fetchGoogleSheetCsv };
