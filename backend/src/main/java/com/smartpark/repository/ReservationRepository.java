package com.smartpark.repository;

import com.smartpark.model.Reservation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReservationRepository extends MongoRepository<Reservation, String> {

    List<Reservation> findByStatusOrderByFromTimeAsc(Reservation.Status status);

    List<Reservation> findBySlotIdAndStatusIn(String slotId, List<Reservation.Status> statuses);

    List<Reservation> findAllByOrderByCreatedAtDesc();
}
