package com.vitae.api.controller;

import com.vitae.api.model.Trip;
import com.vitae.api.service.TripService;
import com.opencsv.CSVWriter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/exports")
@CrossOrigin(origins = "*")
public class ExportController {

    @Autowired
    private TripService tripService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @GetMapping("/trips/csv")
    public ResponseEntity<byte[]> exportTripsToCsv() throws IOException {
        List<Trip> trips = tripService.listTrips();
        
        StringWriter sw = new StringWriter();
        CSVWriter writer = new CSVWriter(sw);

        // Header
        writer.writeNext(new String[]{"ID", "Serviço", "Rota", "Motorista", "Veículo", "Partida", "Status"});

        for (Trip trip : trips) {
            String serviceCode = (trip.getSegment() != null && trip.getSegment().getService() != null) 
                ? trip.getSegment().getService().getCode() : "-";
            String routeName = (trip.getSegment() != null) 
                ? trip.getSegment().getOrigin() + " x " + trip.getSegment().getDestination() : "-";

            writer.writeNext(new String[]{
                trip.getId().toString(),
                serviceCode,
                routeName,
                trip.getDriver() != null ? trip.getDriver().getName() : "S/ Motorista",
                trip.getVehicle() != null ? trip.getVehicle().getPrefix() : "S/ Veículo",
                trip.getDepartureTime() != null ? trip.getDepartureTime().format(DATE_FORMATTER) : "-",
                trip.getStatus() != null ? trip.getStatus().toString() : "SCHEDULED"
            });
        }
        writer.close();

        byte[] csvBytes = sw.toString().getBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=escalas.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }

    @GetMapping("/trips/excel")
    public ResponseEntity<byte[]> exportTripsToExcel() throws IOException {
        List<Trip> trips = tripService.listTrips();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Escalas");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.SKY_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            // Header Row
            Row headerRow = sheet.createRow(0);
            String[] columns = {"ID", "Serviço", "Rota", "Motorista", "Veículo", "Partida", "Status"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data Rows
            int rowIdx = 1;
            for (Trip trip : trips) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(trip.getId());
                
                String serviceCode = (trip.getSegment() != null && trip.getSegment().getService() != null) 
                    ? trip.getSegment().getService().getCode() : "-";
                String routeName = (trip.getSegment() != null) 
                    ? trip.getSegment().getOrigin() + " x " + trip.getSegment().getDestination() : "-";

                row.createCell(1).setCellValue(serviceCode);
                row.createCell(2).setCellValue(routeName);
                row.createCell(3).setCellValue(trip.getDriver() != null ? trip.getDriver().getName() : "S/ Motorista");
                row.createCell(4).setCellValue(trip.getVehicle() != null ? trip.getVehicle().getPrefix() : "S/ Veículo");
                row.createCell(5).setCellValue(trip.getDepartureTime() != null ? trip.getDepartureTime().format(DATE_FORMATTER) : "-");
                row.createCell(6).setCellValue(trip.getStatus() != null ? trip.getStatus().toString() : "SCHEDULED");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=escalas.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        }
    }
}
