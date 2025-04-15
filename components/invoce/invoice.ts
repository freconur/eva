import { StyleSheet } from "@react-pdf/renderer";
export const styles = StyleSheet.create({
  page: {
    // flexDirection: "row",
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: "#ffff",
    margin:"20px"
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  tituloPrincipal: {
    color: "#475569",
    textAlign:"left",
    fontWeight:600,
    textTransform:"uppercase",
    marginBottom:"20px",
    // marginTop:"20px"
  },
  tituloSecundario: {
    fontSize:'12px',
    color: "#475569",
    textTransform:"capitalize",
    fontWeight:600
  },
  containerInfo:{
    // display:'flex',
    flexDirection: "row",
    marginBottom:"5px"
  },
  label:{
    fontSize:'12px',
    color: "#475569",
    marginRight:"5px",
  },
  tituloTabla: {
    fontSize:'13px',
    color: "#475569",
    textTransform:"uppercase"
  },
  containerTabla:{
    marginVertical:"10px"
  },
  // tabla
});
