import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fetch-sheet-D9XHGnnJ.js
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
var TitleRequest = object({ id: string().regex(/^[a-zA-Z0-9-_]{16,}$/) });
var fetchGoogleSheetTitle = createServerFn({ method: "POST" }).validator(TitleRequest).handler(createSsrRpc("e13a659a7bbc89509771ed572179d2eacbd2bccaa0ff216dd15d3b5ccef946a1"));
//#endregion
export { fetchGoogleSheetCsv, fetchGoogleSheetTitle };
