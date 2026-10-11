import {
  SERVICE_CODES,
} from "@/lib/platform/services";


export function getServiceWorkspacePath(
  serviceCode: string,
  serviceReferenceId: string
) {
  switch (serviceCode) {
    case SERVICE_CODES.SUBMINNO:
      return (
        "/subminno/check/" +
        encodeURIComponent(
          serviceReferenceId
        )
      );


    /*
     * Presentation does not yet have its
     * persistent workspace route.
     */
    case SERVICE_CODES.PRESENTATION:
      return "/presentation";


    default:
      return "/";
  }
}