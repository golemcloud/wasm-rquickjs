// formdata-node shim — re-exports the runtime's built-in FormData/File/Blob
import { FormData as _FormData, formDataToBlob as _formDataToBlob } from '__wasm_rquickjs_builtin/http_form_data';
import { Blob as _Blob, File as _File } from '__wasm_rquickjs_builtin/http_blob';

export const FormData = _FormData;
export const formDataToBlob = _formDataToBlob;
export const Blob = _Blob;
export const File = _File;

export default { FormData: _FormData, formDataToBlob: _formDataToBlob, Blob: _Blob, File: _File };
